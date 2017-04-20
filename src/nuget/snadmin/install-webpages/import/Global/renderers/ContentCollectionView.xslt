﻿<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sec="sn://SenseNet.Portal.Helpers.Security"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt"
    xmlns:snc="sn://SenseNet.Portal.UI.ContentTools"
                exclude-result-prefixes="msxsl snc sec"
>

  <xsl:variable name="smallcase" select="'abcdefghijklmnopqrstuvwxyz'" />
  <xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />
  
  <xsl:template match="/">
    <ul>
      <xsl:value-of select="sec:IsInRole('SmartEditors')"/>
      <xsl:apply-templates select ="Content" />
    </ul>
  </xsl:template>


  <xsl:template match="Content">
    <li class="sn-generic-content">
      <div class="sn-generic-content-full">
        <div class="sn-generic-content-name">
          <h4>
            <a href="{Actions/Browse}"><xsl:value-of select="ContentName"/></a>
            <br />
            <a href="{Actions/Browse}">
              <xsl:value-of select="SelfLink"/>
            </a>
          </h4>
        </div>

        <!--<div class="sn-generic-list-fields">
          <div class="sn-generic-list-fields-title">Fields:</div>
          <ul class="sn-generic-list-fields-list">
            <xsl:if test="not(Fields)">
              <li/>
            </xsl:if>
            <xsl:apply-templates select="Fields/*" />
          </ul>
        </div>-->
        <div class="sn-generic-list-items">
        <h5 class="sn-generic-list-items-title">
          <xsl:variable name="items" select="snc:GetResourceString('$Renderers, Items')" />
          <span class="sn-title">
            <xsl:value-of select="$items"/>
          </span>
          <span class="sn-value">
            <xsl:value-of select="count(Children/*)"/>
          </span>
        </h5>
        <ul class="sn-generic-list-items-list">
          <xsl:apply-templates select="Children/Content" />
        </ul>
      </div>
      </div>
    </li>
  </xsl:template>

  <xsl:template match="Fields/*">
    <li class="sn-generic-field sn-field-{translate(name(),$uppercase, $smallcase)}">
      <span>
        <xsl:value-of select="name()"/>
      </span>:
      <span>
        <xsl:value-of select="." disable-output-escaping="yes"/>
      </span>
    </li>
  </xsl:template>

  <xsl:template match="*"></xsl:template>
</xsl:stylesheet>
